import React from 'react';

interface StatusBarProps {
  currentStatus: number; // 1-4
  statusLabels: string[];
}

export const StatusBar: React.FC<StatusBarProps> = ({ currentStatus, statusLabels }) => {
  const steps = [
    { icon: 'check', label: statusLabels[0] || 'Pedido Confirmado' },
    { icon: 'payment', label: statusLabels[1] || 'Pagamento Aprovado' },
    { icon: 'shipping', label: statusLabels[2] || 'A Caminho' },
    { icon: 'delivered', label: statusLabels[3] || 'Entregue' },
  ];

  const getIcon = (stepIndex: number, isCompleted: boolean) => {
    if (isCompleted) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }

    switch (stepIndex) {
      case 0:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5L16 12L9 19" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 1:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10H21M7 15H17M11 3V21" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 2:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7M3 7L10.5 12L21 7M3 7L3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V7" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 3:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      border={0}
      role="presentation"
      className="w-full my-8 bg-gray-50 rounded-xl p-6"
    >
      <tr>
        <td>
          <h3 className="m-0 mb-5 text-lg font-semibold text-gray-900 text-center">
            Status do Pedido
          </h3>

          {/* Progress Line */}
          <table
            cellPadding="0"
            cellSpacing="0"
            border={0}
            role="presentation"
            className="w-full mb-5"
          >
            <tr>
              <td className="text-center">
                <div className="relative h-1 bg-gray-200 rounded mx-5">
                  {currentStatus >= 1 && (
                    <div
                      className="absolute top-0 left-0 h-1 w-1/4 rounded"
                      style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)' }}
                    />
                  )}
                  {currentStatus >= 2 && (
                    <div
                      className="absolute top-0 left-1/4 h-1 w-1/4 rounded"
                      style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)' }}
                    />
                  )}
                  {currentStatus >= 3 && (
                    <div
                      className="absolute top-0 left-1/2 h-1 w-1/4 rounded"
                      style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)' }}
                    />
                  )}
                  {currentStatus >= 4 && (
                    <div
                      className="absolute top-0 left-3/4 h-1 w-1/4 rounded"
                      style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                    />
                  )}
                </div>
              </td>
            </tr>
          </table>

          {/* Status Dots */}
          <table
            cellPadding="0"
            cellSpacing="0"
            border={0}
            role="presentation"
            className="w-full"
          >
            <tr>
              {steps.map((step, index) => {
                const isCompleted = currentStatus > index;
                const isCurrent = currentStatus === index + 1;
                const isLast = index === 3;

                return (
                  <td key={index} className="w-1/4 text-center align-top">
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                      style={{
                        background: isCompleted
                          ? 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)'
                          : isLast && isCompleted
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : '#CBD5E1',
                        boxShadow: isCompleted
                          ? isLast
                            ? '0 4px 14px 0 rgba(16, 185, 129, 0.25)'
                            : '0 4px 14px 0 rgba(79, 70, 229, 0.25)'
                          : '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {getIcon(index, isCompleted)}
                    </div>
                    <div
                      className="text-xs leading-tight"
                      style={{
                        color: isCompleted ? (isLast ? '#10B981' : '#4F46E5') : '#64748B',
                        fontWeight: isCompleted ? '600' : 'normal',
                      }}
                    >
                      {step.label}
                    </div>
                  </td>
                );
              })}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  );
};